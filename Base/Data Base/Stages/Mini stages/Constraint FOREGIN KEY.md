\-принуждает использовать только значения из определенного столбца таблицы-родителя или значение "null".


### Пример:
```sql
create table STUDENTS
(
    ID         number,
    NAME       varchar2(15),
    COURSE     number,
    FACULTY_ID integer constraint st_faculty_fk references FACULTIES(id)
    --or
--     FACULTY_ID integer references FACULTIES(id)
   --or
--     constraint  fk foreign key (FACULTY_ID) references FACULTIES(id)
);

create table faculties (
id number primary key,
name varchar2(15)
);

select * from STUDENTS;
select * from FACULTIES;

insert into FACULTIES values (1, 'CS');
insert into FACULTIES values (2, 'Marketing');

insert into STUDENTS values (2, 'Zaur', 4, 1);
insert into STUDENTS values (1, 'Zaur', 3, 5);
insert into STUDENTS values (1, 'Zaur', 3, null);
insert into STUDENTS values (7, 'Andrey', 3, 2);
```

Добавление констрэинта:
```sql
alter table STUDENTS
    add constraint fc foreign key (FACULTY_ID) references FACULTIES(id);

alter table STUDENTS
    modify (faculty_id constraint fk references faculties(id));
alter table STUDENTS
    modify (faculty_id references faculties(id));
```

### Self-references
Иногда нам необходимо, чтобы столбец ссылался на другой столбец в той же самой таблице.

### Каскадное удаление
Создавая constraint мы можем добавить настройку, которая при удалении строки из таблицы, на которую будет ссылаться переменная, удалит все наши строки с значением, ссылающимся на удаленную строку. (с foreign).

```sql
create table STUDENTS
(
    ID         number,
    NAME       varchar2(15),
    COURSE     number,
    FACULTY_ID integer references faculties ON DELETE CASCADE
);
```

### Каскадное присваивание null
Тоже, что и каскадное удаление, но вместо удаления строк будет лишь изменено значение строки с констрэинтом foreign на null:
```
create table STUDENTS
(
    ID         number,
    NAME       varchar2(15),
    COURSE     number,
    FACULTY_ID integer references faculties ON DELETE SET NULL
);
```