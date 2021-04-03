\- принуждает столбцы содержать только уникальные значения и не разрешает содержать значение null. Primary key использует индекс для своей работы. **Одна таблица может содержать лишь один primary key**.

```sql
create table STUDENTS
(
    ID         number constraint st_id_pk primary key,
);

create table STUDENTS
(
    ID         number,
    NAME       varchar2(15),
    constraint pk primary key (id, NAME)
);

alter table STUDENTS modify (id primary key );

alter table STUDENTS add constraint pk primary key (id);
```